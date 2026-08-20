import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationsProvider } from "./hooks/useNotifications";
import { OrdersProvider } from "./hooks/useOrders";
import { UsersProvider } from "./hooks/useUsers";
import AppRouter from "./routes/AppRouter";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <NotificationsProvider>
          <OrdersProvider>
            <UsersProvider>
              <AppRouter />
            </UsersProvider>
          </OrdersProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
