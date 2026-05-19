"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { LayoutDashboard, LogOut, User, Settings, Sparkles } from "lucide-react"

export function UserNav({ user, onLogout }) {
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all p-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-white font-bold">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 rounded-2xl p-2 shadow-2xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none flex items-center gap-2">
              {user.name}
              {user.role === 'admin' && <Sparkles className="w-3 h-3 text-primary animate-pulse" />}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuGroup className="space-y-1">
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer rounded-xl h-10">
              <User className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
          </Link>
          {user.role === 'admin' && (
            <Link href="/admin">
              <DropdownMenuItem className="cursor-pointer rounded-xl h-10 bg-primary/5 text-primary focus:bg-primary/10 focus:text-primary">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </DropdownMenuItem>
            </Link>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem className="cursor-pointer rounded-xl h-10 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
