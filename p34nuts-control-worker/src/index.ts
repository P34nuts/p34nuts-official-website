export default {
  
  async fetch(request: Request, env: { ALLOWED_ORIGINS: string }): Promise<Response> {
    
    if (new URL(request.url).pathname === "/health") return new Response(JSON.stringify({ ok: true, service: "p34nuts-control-center" }), { headers: { "content-type": "application/json" } });
    
    return new Response("Control worker pending configuration", { status: 503 });
    
  },
  
};




