'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Camera,
  LayoutDashboard,
} from 'lucide-react';
import { InitialLoadingShell } from '@/components/initial-loading-shell';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Safety fallback: Ensure load screen disappears after 3s
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    fetchProfile();
    return () => clearTimeout(timer);
  }, []);

  async function fetchProfile() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data || session.user) {
        const activeUser = { ...session.user, ...data };
        setUser(activeUser);
        setFirstName(
          data?.first_name || session.user.user_metadata?.first_name || ''
        );
        setLastName(
          data?.last_name || session.user.user_metadata?.last_name || ''
        );
        setUsername(
          data?.username || session.user.user_metadata?.username || ''
        );
        const name =
          data?.full_name ||
          session.user.user_metadata?.full_name ||
          data?.username ||
          session.user.email.split('@')[0];
        setFullName(name);
        setAvatarUrl(
          data?.avatar_url ||
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            ''
        );
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUpdating(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('profiles').getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Auto-save the new avatar URL
      await saveProfile(firstName, lastName, fullName, username, publicUrl);
      alert('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert(
        "Error uploading avatar. Make sure you have a 'profiles' bucket in Supabase storage."
      );
    } finally {
      setUpdating(false);
    }
  };

  async function saveProfile(fName, lName, full, uname, avatar) {
    const response = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        firstName: fName,
        lastName: lName,
        fullName: full,
        username: uname,
        avatarUrl: avatar,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      const error = new Error(
        result.message || result.error || 'Failed to update profile'
      );
      if (result.suggestions) error.suggestions = result.suggestions;
      throw error;
    }

    // Refresh local user state and session storage
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const activeUser = {
        id: session.user.id,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        full_name: profile?.full_name || '',
        username: profile?.username || session.user.email,
        email: profile?.email || session.user.email,
        role: profile?.role || 'user',
        has_generator_access: profile?.has_generator_access || false,
        name: profile?.full_name || profile?.username || session.user.email,
        avatar:
          profile?.avatar_url ||
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          null,
      };

      setUser(activeUser);
      sessionStorage.setItem('user', JSON.stringify(activeUser));
    }
    return result;
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setUpdating(true);
    setSuggestions([]);

    try {
      const result = await saveProfile(
        firstName,
        lastName,
        null,
        username,
        avatarUrl
      );
      setFullName(
        result.user?.user_metadata?.full_name ||
          `${firstName} ${lastName}`.trim()
      );
      alert('Profile updated successfully!');
    } catch (err) {
      if (err.suggestions) {
        setSuggestions(err.suggestions);
      }
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <InitialLoadingShell isReady={!loading} />
      <div className="min-h-screen bg-transparent pb-20">
        <div className="container mx-auto px-4 py-12 max-w-2xl animate-in-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="w-full sm:w-auto justify-start sm:justify-center hover:bg-accent rounded-2xl transition-all group border border-transparent hover:border-border"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            {user?.role === 'admin' && (
              <Button
                onClick={() => router.push('/admin')}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03] active:scale-95 gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Button>
            )}
          </div>

          <Card className="shadow-2xl border-border overflow-hidden rounded-[40px] bg-card/40 backdrop-blur-xl">
            <div className="h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.1),transparent)]" />
            </div>

            <CardHeader className="space-y-1 relative pt-0">
              <div className="flex flex-col items-center -mt-20 mb-8">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary via-emerald-500 to-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative">
                    <Avatar className="h-40 w-40 border-[6px] border-background shadow-2xl relative">
                      <AvatarImage
                        src={avatarUrl || user?.avatar}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-5xl font-black bg-muted text-primary">
                        {firstName?.charAt(0).toUpperCase() ||
                          fullName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-1 right-1 w-11 h-11 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-background">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleAvatarChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
                <h2 className="text-4xl font-black mt-6 tracking-tight text-foreground">
                  {fullName}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-bold py-1 px-3 bg-muted rounded-full">
                    {user?.role?.replace('_', ' ')}
                  </span>
                  {user?.has_generator_access && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[10px] py-0.5 px-2.5 rounded-full font-black uppercase">
                      Generator Pro
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleUpdate}>
              <CardContent className="space-y-8 px-10">
                <div className="grid gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="firstName"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="h-14 rounded-2xl border-primary/20 focus-visible:ring-primary bg-slate-950/40 shadow-inner font-medium"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="lastName"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="h-14 rounded-2xl border-primary/20 focus-visible:ring-primary bg-slate-950/40 shadow-inner font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                      >
                        Display Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="h-14 rounded-2xl border-primary/20 focus-visible:ring-primary bg-slate-950/40 shadow-inner font-medium"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="username"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                      >
                        Unique Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value.toLowerCase().replace(/\s+/g, '_')
                          )
                        }
                        placeholder="username"
                        className={`h-14 rounded-2xl border-primary/20 focus-visible:ring-primary bg-slate-950/40 shadow-inner font-medium ${suggestions.length > 0 ? 'border-amber-500/50' : ''}`}
                      />
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 px-1 animate-in-fade">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter w-full mb-1">
                            Taken. Try one of these:
                          </span>
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                setUsername(suggestion);
                                setSuggestions([]);
                              }}
                              className="text-[10px] font-black bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <UserIcon className="w-20 h-20" />
                    </div>
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">
                      Connected Identity
                    </Label>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold tracking-tight">
                        {user?.email}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border/60 text-muted-foreground"
                      >
                        Linked
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-4 p-10 mt-4">
                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden group/btn"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {updating ? 'Processing...' : 'Secure Save'}
                    {!updating && <Save className="w-5 h-5" />}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
