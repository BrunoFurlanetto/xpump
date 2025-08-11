import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/session";
import { PublicPages } from "./lib/authorization";

export default async function middleware(req: NextRequest) {
    const currentPath = req.nextUrl.pathname;
    const isPublicRoute = PublicPages.includes(currentPath);

    if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: ${currentPath}, isPublic: ${isPublicRoute}`);
    }

    // Evitar loop de redirecionamento
    if (currentPath === "/login" && req.nextUrl.searchParams.get("returnTo") === "/login") {
        if (process.env.NODE_ENV === 'development') {
            console.log("Loop de redirecionamento detectado, limpando returnTo");
        }
        const cleanUrl = new URL("/login", req.nextUrl);
        return NextResponse.redirect(cleanUrl);
    }

    try {
        // Verificar sessão sem redirecionar
        const session = await verifySession(false);

        // Se a rota é pública, deixar passar
        if (isPublicRoute) {
            // Se está logado e tentando acessar login, redirecionar para profile ao invés de /
            if (currentPath === "/login" && session?.user_id) {
                if (process.env.NODE_ENV === 'development') {
                    console.log("Usuário logado tentando acessar login, redirecionando para /profile");
                }
                return NextResponse.redirect(new URL("/profile", req.nextUrl));
            }
            return NextResponse.next();
        }

        // Se a rota é protegida e não tem sessão válida
        if (!session?.user_id) {
            if (process.env.NODE_ENV === 'development') {
                console.log("Sessão inválida para rota protegida, redirecionando para login");
            }
            const loginUrl = new URL("/login", req.nextUrl);
            // Só adicionar returnTo se não for a página raiz
            if (currentPath !== "/") {
                loginUrl.searchParams.set("returnTo", currentPath);
            }
            return NextResponse.redirect(loginUrl);
        }

        if (process.env.NODE_ENV === 'development') {
            console.log("Sessão válida, permitindo acesso");
        }
        return NextResponse.next();

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log("Erro no middleware:", error);
        }
        // Em caso de erro, redirecionar para login se a rota for protegida
        if (!isPublicRoute) {
            return NextResponse.redirect(new URL("/login", req.nextUrl));
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|logo|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico|manifest.webmanifest|sw.js).*)",
    ],
};
