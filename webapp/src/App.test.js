import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import App from "./App";
import store from "./app/store";

test("renders the login screen for an anonymous visitor", async () => {
    render(
        <Provider store={store}>
            <App />
        </Provider>
    );

    expect(await screen.findByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
});
