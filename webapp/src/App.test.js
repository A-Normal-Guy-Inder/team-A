import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import App from "./App";
import store from "./app/store";

// The default CRA test asserted on a "learn react" link that this app never
// had, so it could only ever fail. This checks something real instead: the
// router mounts and the unauthenticated landing route renders the login form.
test("renders the login screen for an anonymous visitor", async () => {
    render(
        <Provider store={store}>
            <App />
        </Provider>
    );

    expect(await screen.findByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
});
