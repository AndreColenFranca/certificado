import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export const useSupabaseSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get session'));
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return { session, loading, error };
};

export const useSupabaseQuery = <T,>(
  table: string,
  filter?: { column: string; value: any }
) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*');

        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data, error } = await query;
        if (error) throw error;
        setData(data as T[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, filter]);

  return { data, loading, error };
};

export const useSupabaseInsert = (table: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const insert = async (record: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from(table).insert([record]).select();
      if (error) throw error;
      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to insert');
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return { insert, loading, error };
};

export const useSupabaseUpdate = (table: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = async (id: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update');
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};

export const useSupabaseDelete = (table: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const delete_ = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to delete');
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return { delete: delete_, loading, error };
};
