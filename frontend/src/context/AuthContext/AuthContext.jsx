import { createContext } from 'react';

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  register: () => {},
  updateUser: () => {},
  isAuthenticated: false,
});

export default AuthContext;
