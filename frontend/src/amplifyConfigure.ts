import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID as string,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN as string,
          scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN as string],
          redirectSignOut: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT as string],
          responseType: 'code',
        },
      },
    },
  },
});
