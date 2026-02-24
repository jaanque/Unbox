import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (offerId: string) => Promise<void>;
  isFavorite: (offerId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<Session | null>(null);

  const fetchFavorites = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('offer_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorites:', error);
      return;
    }

    if (data) {
      const favoriteIds = new Set(data.map((item) => item.offer_id));
      setFavorites(favoriteIds);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchFavorites(session.user.id);
      } else {
        setFavorites(new Set());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchFavorites(session.user.id);
      } else {
        setFavorites(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchFavorites]);

  const toggleFavorite = async (offerId: string) => {
    if (!session?.user) return;

    const isFav = favorites.has(offerId);
    const newFavorites = new Set(favorites);

    if (isFav) {
      newFavorites.delete(offerId);
    } else {
      newFavorites.add(offerId);
    }
    setFavorites(newFavorites);

    try {
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('offer_id', offerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: session.user.id, offer_id: offerId });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert state
      setFavorites(favorites);
    }
  };

  const isFavorite = (offerId: string) => favorites.has(offerId);

  const refreshFavorites = async () => {
      if (session?.user) {
          await fetchFavorites(session.user.id);
      }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
