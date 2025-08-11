import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/session";
import { PublicPages } from "./lib/authorization";

export default async function middleware(req: NextRequest) {
    const currentPath = req.nextUrl.pathname;
    const isPublicRoute = PublicPages.includes(currentPath);

    console.log(`🔍 Middleware: ${currentPath} - Public: ${isPublicRoute}`);

    try {
        // Verificar sessão sem redirecionar
        const session = await verifySession(false);

        // Se a rota é pública, deixar passar
        if (isPublicRoute) {
            // Se está logado e tentando acessar login, redirecionar para home
            if (currentPath === "/login" && session?.user_id) {
                console.log("🔄 Redirecting logged user from login to home");
                return NextResponse.redirect(new URL("/", req.nextUrl));
            }
            return NextResponse.next();
        }

        // Se a rota é protegida e não tem sessão válida
        if (!session?.user_id) {
            console.log("🚫 Unauthorized access, redirecting to login");
            const loginUrl = new URL("/login", req.nextUrl);
            loginUrl.searchParams.set("returnTo", currentPath);
            return NextResponse.redirect(loginUrl);
        }

        console.log("✅ Authorized access");
        return NextResponse.next();

    } catch (error) {
        console.error("❌ Middleware error:", error);
        // Em caso de erro, redirecionar para login se a rota for protegida
        if (!isPublicRoute) {
            return NextResponse.redirect(new URL("/login", req.nextUrl));
        }
        return NextResponse.next();
    }

    // 4. check if user has access to the page
    // const canAccess = canAccessPage({
    //     role: session?.user.role || "",
    //     page: currentPath,
    // })

    // if (!canAccess) {
    //     return NextResponse.redirect(new URL("/not-permitted", req.nextUrl));
    // }
    // 5. render route
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|images|manifest.webmanifest).*)",
    ],
};
