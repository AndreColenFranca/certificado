import { SupabaseClient } from '@supabase/supabase-js';

export interface AttributeRecord {
  id: string;
  name: string;
  description?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export async function getAttributes(supabase: SupabaseClient, tableName: string): Promise<AttributeRecord[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('order', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error(`Error fetching from ${tableName}:`, err);
    throw err;
  }
}

export async function getAttribute(supabase: SupabaseClient, tableName: string, id: string): Promise<AttributeRecord> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error(`Error fetching from ${tableName}:`, err);
    throw err;
  }
}

export async function createAttribute(supabase: SupabaseClient, tableName: string, attr: Partial<AttributeRecord>): Promise<AttributeRecord> {
  try {
    const now = new Date().toISOString();
    const id = `${tableName.slice(0, 3)}-${Math.random().toString(36).substr(2, 9)}`.toLowerCase();

    const { data, error } = await supabase
      .from(tableName)
      .insert([{
        id,
        name: attr.name,
        description: attr.description,
        order: attr.order,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error(`Error creating in ${tableName}:`, err);
    throw err;
  }
}

export async function updateAttribute(supabase: SupabaseClient, tableName: string, id: string, attr: Partial<AttributeRecord>): Promise<AttributeRecord> {
  try {
    console.log(`[updateAttribute] Recebido:`, { id, attr });
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (attr.name) updateData.name = attr.name;
    if (attr.description !== undefined) updateData.description = attr.description;
    if (attr.order !== undefined) updateData.order = attr.order;

    console.log(`[updateAttribute] Enviando para Supabase:`, { tableName, id, updateData });

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log(`[updateAttribute] Resposta do Supabase:`, { data, error });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error(`Error updating in ${tableName}:`, err);
    throw err;
  }
}

export async function deleteAttribute(supabase: SupabaseClient, tableName: string, id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err: any) {
    console.error(`Error deleting from ${tableName}:`, err);
    throw err;
  }
}
