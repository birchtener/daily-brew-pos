import { User } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col px-36">
        <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application settings.</p>
        </div>
        <div className="mt-8 rounded-lg border-border border bg-card p-6">
            <div className="flex items-center gap-2">
                <User className="size-5" />
                <h2 className="text-lg font-medium">Account Settings</h2>
            </div>
            <p className="text-sm text-muted-foreground">Update your profile picture. Recommended size: 400x400 pixels.</p>
        </div>
    </div>
  )
}
