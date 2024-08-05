import { users } from "./users";

export async function GET() {
  return new Response(JSON.stringify(users), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function POST(request: Request) {
  const user = await request.json();

  // Check if the username already exists
  const usernameExists = users.some((u) => u.username === user.username);
  if (usernameExists) {
    return new Response(JSON.stringify({ error: "Username already exists" }), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 400, // Bad Request
    });
  }

  // Create a new user
  const newUser = {
    id: users.length + 1,
    username: user.username,
  };
  users.push(newUser);

  return new Response(JSON.stringify(newUser), {
    headers: {
      "Content-Type": "application/json",
      Message: "User registered successfully",
    },
    status: 201, // Created
  });
}
