Deno.serve(() => {
  return new Response(null, {
    status: 302,
    headers: { 'Location': 'pepite://wallet' },
  });
});
