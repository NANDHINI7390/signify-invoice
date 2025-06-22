'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FilePlus2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg role="img" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.4H18.04C17.74 15.93 16.92 17.22 15.63 18.06V20.73H19.46C21.56 18.83 22.56 15.83 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C14.97 23 17.45 22.04 19.46 20.73L15.63 18.06C14.66 18.73 13.43 19.13 12 19.13C9.12 19.13 6.66 17.27 5.76 14.81H1.87V17.59C3.81 20.89 7.59 23 12 23Z" fill="#34A853"/>
    <path d="M5.76 14.81C5.56 14.24 5.46 13.62 5.46 13C5.46 12.38 5.56 11.76 5.76 11.19V8.41H1.87C1.15 9.77 0.76 11.32 0.76 13C0.76 14.68 1.15 16.23 1.87 17.59L5.76 14.81Z" fill="#FBBC05"/>
    <path d="M12 6.87C13.56 6.87 14.93 7.42 15.99 8.41L19.53 4.87C17.45 3.09 14.97 2 12 2C7.59 2 3.81 4.11 1.87 7.41L5.76 10.19C6.66 7.73 9.12 6.87 12 6.87Z" fill="#EA4335"/>
  </svg>
);

export default function SignIn() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md text-center shadow-lg animate-fadeIn">
        <CardHeader>
          <FilePlus2 className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold font-headline">Create Your First Invoice</CardTitle>
          <CardDescription className="font-body">Please sign in to continue. It's free and secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={signInWithGoogle}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm font-body"
            size="lg"
          >
            <GoogleIcon />
            <span className="ml-3">Sign in with Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
