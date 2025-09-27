import { UserFriendlyApplicationSettings } from "./UserFriendlyApplicationSettings";

export function ApplicationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Job Application Settings</h2>
        <p className="text-muted-foreground">
          Configure all aspects of your job application process and forms with an easy-to-use interface.
        </p>
      </div>

      <UserFriendlyApplicationSettings />
    </div>
  );
}