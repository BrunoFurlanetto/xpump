import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/session";
import { PublicPages } from "./lib/authorization";

export default async function middleware(req: NextRequest) {
    const currentPath = req.nextUrl.pathname;
    const isPublicRoute = PublicPages.includes(currentPath);


    try {
        // Verificar sessão sem redirecionar
        const session = await verifySession(false);

        // Se a rota é pública, deixar passar
        if (isPublicRoute) {
            // Se está logado e tentando acessar login, redirecionar para home
            if (currentPath === "/login" && session?.user_id) {
                return NextResponse.redirect(new URL("/", req.nextUrl));
            }
            return NextResponse.next();
        }

        // Se a rota é protegida e não tem sessão válida
        if (!session?.user_id) {
            const loginUrl = new URL("/login", req.nextUrl);
            loginUrl.searchParams.set("returnTo", currentPath);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();

    } catch {
        // Em caso de erro, redirecionar para login se a rota for protegida
        if (!isPublicRoute) {
            return NextResponse.redirect(new URL("/login", req.nextUrl));
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|images|manifest.webmanifest).*)",
    ],
};
