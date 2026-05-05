export default async (request) => {
  // Only allow POST
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, first_name, last_name } = await request.json();

    const res = await fetch(
      "https://api.beehiiv.com/v2/publications/pub_e49859f8-dc3c-4c21-92c0-86a2035a1f3f/subscriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer kZv1TA5V1aKWl7hMtnawcXaS8RlxIy9E1b1yh5dDsZyKDbWAophIurR3dzh57H3W",
        },
        body: JSON.stringify({
          email,
          first_name,
          last_name,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: "f5-pushup-challenge",
          utm_medium: "app-signup",
        }),
      }
    );

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/subscribe" };