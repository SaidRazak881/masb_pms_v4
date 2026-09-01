"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("zarina.abubakar@mimosacademy.my");
  const [password, setPassword] = useState("demo-password");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Mock: dalam pelaksanaan sebenar, panggil Supabase Auth
    // (createClient() daripada @/lib/supabase/client -> signInWithPassword).
    setTimeout(() => {
      router.push("/programmes");
    }, 700);
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">MIMOS Academy</CardTitle>
          <CardDescription>
            Training Programme Management System (TPMS)
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mel</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@mimosacademy.my"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Laluan</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log Masuk
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Mod Demo Mock UI — pengesahan Supabase Auth akan diintegrasikan
            kemudian.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
