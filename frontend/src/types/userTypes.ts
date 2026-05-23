export interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: 'admin' | 'staff';
    is_password_temp?: boolean;
}

export interface ParsedUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: 'admin' | 'staff';
    is_password_temp?: boolean;
}