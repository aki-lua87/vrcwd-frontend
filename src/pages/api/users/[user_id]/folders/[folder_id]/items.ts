import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const { user_id, folder_id } = params;
  const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
  
  if (!user_id || !folder_id) {
    return new Response(
      JSON.stringify({ error: 'user_id と folder_id は必須です' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = `${baseUrl}/v2/users/${user_id}/folders/${folder_id}/items`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Backend API error: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'API リクエストでエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};