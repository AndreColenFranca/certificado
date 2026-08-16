import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Por enquanto, retorna usuário raiz (depois integrar com JWT)
    const currentUser = {
      id: 'user-root-001',
      name: 'André Luiz Colen',
      email: 'andreluiz.colen@gmail.com',
      role: 'root',
      isRoot: true,
      orgId: '550e8400-e29b-41d4-a716-446655440000',
      orgName: 'Maison Lumière Joias'
    };

    return res.status(200).json({
      success: true,
      data: currentUser
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
