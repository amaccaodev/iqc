import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationsProvider } from "./hooks/useNotifications";
import { OrdersProvider } from "./hooks/useOrders";
import { UsersProvider } from "./hooks/useUsers";
import { KeyboardViewportProvider } from "./hooks/useKeyboardViewport";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider } from "./hooks/useToast";
import AppRouter from "./routes/AppRouter";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <ThemeProvider>
        <ToastProvider>
          <KeyboardViewportProvider>
            <AuthProvider>
              <NotificationsProvider>
                <OrdersProvider>
                  <UsersProvider>
                    <AppRouter />
                  </UsersProvider>
                </OrdersProvider>
              </NotificationsProvider>
            </AuthProvider>
          </KeyboardViewportProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
