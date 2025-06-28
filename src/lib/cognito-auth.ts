import { 
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  GetUserCommand,
  GlobalSignOutCommand
} from '@aws-sdk/client-cognito-identity-provider';
import CryptoJS from 'crypto-js';

interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  clientSecret?: string;
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface UserInfo {
  username: string;
  email?: string;
  attributes: Record<string, string>;
}

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({
      region: config.region,
    });
  }

  /**
   * Calculate SECRET_HASH for Cognito client authentication
   */
  private calculateSecretHash(username: string): string | undefined {
    if (!this.config.clientSecret) {
      return undefined;
    }
    
    const message = username + this.config.clientId;
    return CryptoJS.HmacSHA256(message, this.config.clientSecret).toString(CryptoJS.enc.Base64);
  }

  /**
   * Sign in user with username/email and password
   */
  async signIn(username: string, password: string): Promise<AuthTokens> {
    try {
      const secretHash = this.calculateSecretHash(username);
      
      const authParams: Record<string, string> = {
        USERNAME: username,
        PASSWORD: password,
      };
      
      if (secretHash) {
        authParams.SECRET_HASH = secretHash;
      }

      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.config.clientId,
        AuthParameters: authParams,
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      const tokens: AuthTokens = {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresAt: Date.now() + (response.AuthenticationResult.ExpiresIn! * 1000),
      };

      // Store tokens securely in localStorage (with encryption in production)
      this.storeTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Sign up new user
   */
  async signUp(username: string, password: string, email: string, attributes: Record<string, string> = {}): Promise<void> {
    try {
      const secretHash = this.calculateSecretHash(username);
      
      const userAttributes = [
        { Name: 'email', Value: email },
        ...Object.entries(attributes).map(([key, value]) => ({ Name: key, Value: value }))
      ];

      const commandParams: any = {
        ClientId: this.config.clientId,
        Username: username,
        Password: password,
        UserAttributes: userAttributes,
      };

      if (secretHash) {
        commandParams.SecretHash = secretHash;
      }

      const command = new SignUpCommand(commandParams);
      await this.client.send(command);
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Confirm user sign up with verification code
   */
  async confirmSignUp(username: string, confirmationCode: string): Promise<void> {
    try {
      const secretHash = this.calculateSecretHash(username);
      
      const commandParams: any = {
        ClientId: this.config.clientId,
        Username: username,
        ConfirmationCode: confirmationCode,
      };

      if (secretHash) {
        commandParams.SecretHash = secretHash;
      }

      const command = new ConfirmSignUpCommand(commandParams);
      await this.client.send(command);
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const tokens = this.getStoredTokens();
      if (!tokens || this.isTokenExpired(tokens)) {
        return null;
      }

      const command = new GetUserCommand({
        AccessToken: tokens.accessToken,
      });

      const response = await this.client.send(command);
      
      const attributes: Record<string, string> = {};
      response.UserAttributes?.forEach(attr => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      return {
        username: response.Username!,
        email: attributes.email,
        attributes,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      const tokens = this.getStoredTokens();
      if (tokens) {
        const command = new GlobalSignOutCommand({
          AccessToken: tokens.accessToken,
        });
        await this.client.send(command);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearStoredTokens();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null && !this.isTokenExpired(tokens);
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      return null;
    }

    if (!this.isTokenExpired(tokens)) {
      return tokens.accessToken;
    }

    // TODO: Implement token refresh logic
    this.clearStoredTokens();
    return null;
  }

  /**
   * Store tokens securely (in production, consider encryption)
   */
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('auth_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  private clearStoredTokens(): void {
    localStorage.removeItem('auth_tokens');
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokens: AuthTokens): boolean {
    return Date.now() >= tokens.expiresAt;
  }

  /**
   * Handle Cognito errors
   */
  private handleCognitoError(error: any): Error {
    const errorCode = error.name || error.__type;
    
    switch (errorCode) {
      case 'NotAuthorizedException':
        return new Error('ユーザー名またはパスワードが正しくありません。');
      case 'UserNotFoundException':
        return new Error('ユーザーが見つかりません。');
      case 'UserNotConfirmedException':
        return new Error('ユーザーの確認が完了していません。確認コードをご確認ください。');
      case 'TooManyRequestsException':
        return new Error('リクエストが多すぎます。しばらく待ってから再度お試しください。');
      case 'InvalidParameterException':
        return new Error('入力パラメータが無効です。');
      case 'UsernameExistsException':
        return new Error('このユーザー名は既に使用されています。');
      default:
        return new Error(error.message || '認証エラーが発生しました。');
    }
  }
}