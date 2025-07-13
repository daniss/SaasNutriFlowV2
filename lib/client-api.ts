/**
 * Client API utilities for secure authenticated requests
 */

export interface ClientApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Makes an authenticated API call for client endpoints
 */
export async function clientApiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ClientApiResponse<T>> {
  try {
    const clientToken = localStorage.getItem("client-token");

    if (!clientToken) {
      return {
        success: false,
        error: "Non authentifié. Veuillez vous reconnecter.",
      };
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data,
      };
    } else {
      // Handle authentication errors
      if (response.status === 401) {
        // Token is invalid, clear stored data and redirect to login
        localStorage.removeItem("client-session");
        localStorage.removeItem("client-token");
        window.location.href = "/client-login";
      }

      return {
        success: false,
        error: data.error || "Erreur lors de la requête",
      };
    }
  } catch (error) {
    console.error("Client API call error:", error);
    return {
      success: false,
      error: "Erreur de connexion",
    };
  }
}

/**
 * GET request helper
 */
export function clientGet<T = any>(
  endpoint: string
): Promise<ClientApiResponse<T>> {
  return clientApiCall<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export function clientPost<T = any>(
  endpoint: string,
  body?: any
): Promise<ClientApiResponse<T>> {
  return clientApiCall<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export function clientPut<T = any>(
  endpoint: string,
  body?: any
): Promise<ClientApiResponse<T>> {
  return clientApiCall<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function clientDelete<T = any>(
  endpoint: string
): Promise<ClientApiResponse<T>> {
  return clientApiCall<T>(endpoint, { method: "DELETE" });
}
