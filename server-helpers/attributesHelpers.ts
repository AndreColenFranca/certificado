import { SupabaseClient } from '@supabase/supabase-js';

console.log('🔴 [HELPERS] Arquivo attributesHelpers.ts foi CARREGADO!');

export interface AttributeRecord {
  id: string;
  name: string;
  org_id: string; // MANDATORY
  description?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export async function getAttributes(supabase: SupabaseClient, tableName: string, orgId: string): Promise<AttributeRecord[]> {
  if (!orgId) {
    throw new Error(`ERRO CRÍTICO: org_id é obrigatório para getAttributes(). Recebido: ${orgId}`);
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('org_id', orgId)
      .order('order', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    throw err;
  }
}

export async function getAttribute(supabase: SupabaseClient, tableName: string, id: string, orgId: string): Promise<AttributeRecord> {
  if (!orgId) {
    throw new Error(`ERRO CRÍTICO: org_id é obrigatório para getAttribute(). Recebido: ${orgId}`);
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(`Atributo não encontrado ou não pertence à sua organização`);
    }

    return data;
  } catch (err: any) {
    throw err;
  }
}

export async function createAttribute(supabase: SupabaseClient, tableName: string, orgId: string, attr: Partial<AttributeRecord>): Promise<AttributeRecord> {
  console.log(`[DEBUG createAttribute] tableName=${tableName}, orgId=${orgId}, name=${attr.name}`);

  if (!orgId) {
    throw new Error(`ERRO CRÍTICO: org_id é obrigatório para createAttribute(). Recebido: ${orgId}`);
  }

  if (!attr.name || !attr.name.trim()) {
    throw new Error('Nome é obrigatório');
  }

  try {
    const now = new Date().toISOString();
    const id = `${tableName.slice(0, 3)}-${Math.random().toString(36).substr(2, 9)}`.toLowerCase();

    console.log(`[DEBUG INSERT] Inserindo: id=${id}, org_id=${orgId}, name=${attr.name}`);
    const { data, error } = await supabase
      .from(tableName)
      .insert([{
        id,
        org_id: orgId,
        name: attr.name.trim(),
        description: attr.description?.trim() || null,
        order: attr.order ?? 0,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    throw err;
  }
}

export async function updateAttribute(supabase: SupabaseClient, tableName: string, id: string, orgId: string, attr: Partial<AttributeRecord>): Promise<AttributeRecord> {
  if (!orgId) {
    throw new Error(`ERRO CRÍTICO: org_id é obrigatório para updateAttribute(). Recebido: ${orgId}`);
  }

  if (!attr.name || !attr.name.trim()) {
    throw new Error('Nome é obrigatório');
  }

  try {
    // Verificar se o atributo pertence à organização do usuário
    const { data: existing, error: fetchError } = await supabase
      .from(tableName)
      .select('org_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new Error('Atributo não encontrado');
    }

    if (existing.org_id !== orgId) {
      throw new Error('Você não tem permissão para alterar este atributo (não pertence à sua organização)');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (attr.name) updateData.name = attr.name.trim();
    if (attr.description !== undefined) updateData.description = attr.description?.trim() || null;
    if (attr.order !== undefined) updateData.order = attr.order;

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    throw err;
  }
}

export async function deleteAttribute(supabase: SupabaseClient, tableName: string, id: string, orgId: string): Promise<void> {
  if (!orgId) {
    throw new Error(`ERRO CRÍTICO: org_id é obrigatório para deleteAttribute(). Recebido: ${orgId}`);
  }

  try {
    // Verificar se o atributo pertence à organização do usuário
    const { data: existing, error: fetchError } = await supabase
      .from(tableName)
      .select('org_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new Error('Atributo não encontrado');
    }

    if (existing.org_id !== orgId) {
      throw new Error('Você não tem permissão para deletar este atributo (não pertence à sua organização)');
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  } catch (err: any) {
    throw err;
  }
}
