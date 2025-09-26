import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Copy,
  Download,
  Monitor,
  Moon,
  Palette,
  Sun,
  Check,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  useTheme,
  type ThemeDefinition,
  type ThemeId,
  type ThemeMode,
} from "../contexts/ThemeContext";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { blokRouter } from "../lib/blok-router";

interface ThemePreviewProps {
  theme: ThemeDefinition;
  mode: ThemeMode;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemePreview({
  theme,
  mode,
  isSelected,
  onSelect,
}: ThemePreviewProps) {
  const colors = theme.colors[mode];

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 glass-card glass-card-hover ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Theme Preview Mockup */}
          <div
            className="h-32 rounded-lg border overflow-hidden relative"
            style={{
              backgroundColor: colors["--background"],
              color: colors["--foreground"],
              borderColor: colors["--border"],
            }}
          >
            {/* Mini Dashboard Preview */}
            <div
              className="h-8 border-b px-3 flex items-center justify-between text-xs"
              style={{
                backgroundColor: colors["--card"],
                borderColor: colors["--border"],
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors["--primary"] }}
                />
                <span style={{ color: colors["--card-foreground"] }}>
                  Dashboard
                </span>
              </div>
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors["--muted-foreground"] }}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors["--muted-foreground"] }}
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3 space-y-2">
              <div
                className="h-3 rounded"
                style={{ backgroundColor: colors["--primary"], width: "60%" }}
              />
              <div
                className="h-2 rounded"
                style={{ backgroundColor: colors["--muted"], width: "80%" }}
              />
              <div
                className="h-2 rounded"
                style={{ backgroundColor: colors["--muted"], width: "40%" }}
              />

              {/* Stats Cards Preview */}
              <div className="flex gap-2 mt-3">
                <div
                  className="flex-1 h-8 rounded border"
                  style={{
                    backgroundColor: colors["--card"],
                    borderColor: colors["--border"],
                  }}
                />
                <div
                  className="flex-1 h-8 rounded border"
                  style={{
                    backgroundColor: colors["--card"],
                    borderColor: colors["--border"],
                  }}
                />
              </div>
            </div>
          </div>

          {/* Theme Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{theme.name}</h3>
              {isSelected && (
                <div className="flex items-center gap-1 text-primary">
                  <Check className="h-4 w-4" />
                  <span className="text-xs">Active</span>
                </div>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {theme.category}
            </Badge>
            <p className="text-sm text-muted-foreground">{theme.description}</p>
          </div>

          {/* Color Swatches */}
          <div className="flex gap-1">
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: colors["--primary"] }}
              title="Primary"
            />
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: colors["--secondary"] }}
              title="Secondary"
            />
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: colors["--accent"] }}
              title="Accent"
            />
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: colors["--muted"] }}
              title="Muted"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CSSExportDialogProps {
  theme: ThemeDefinition;
  mode: ThemeMode;
}

function CSSExportDialog({ theme, mode }: CSSExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const colors = theme.colors[mode];

  const cssVariables = Object.entries(colors)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");

  const cssCode = `/* ${theme.name} Theme - ${
    mode.charAt(0).toUpperCase() + mode.slice(1)
  } Mode */
${mode === "dark" ? ".dark {" : ":root {"}
${cssVariables}
}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      toast.success("CSS variables copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy CSS variables");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([cssCode], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.id}-${mode}-theme.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSS file downloaded!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="glass-button glass-button-hover"
        >
          <Copy className="h-4 w-4 mr-2" />
          Export CSS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Export {theme.name} Theme -{" "}
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
          </DialogTitle>
          <DialogDescription>
            Copy these CSS variables to use this theme in your own projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CSS Variables</Label>
            <div className="relative">
              <pre className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto border">
                <code>{cssCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 glass-button glass-button-hover"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              className="flex-1 glass-button glass-button-hover"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="glass-button glass-button-hover"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ThemesPage() {
  const { isAuthenticated } = useAuth();
  const {
    themeId,
    themeMode,
    setTheme,
    setThemeMode,
    currentTheme,
    allThemes,
  } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    blokRouter.push("/login");
    return null;
  }

  const categories = [
    "All",
    ...Array.from(new Set(allThemes.map((theme) => theme.category))),
  ];

  const filteredThemes = allThemes.filter((theme) => {
    const matchesSearch =
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || theme.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleThemeSelect = (selectedThemeId: ThemeId) => {
    setTheme(selectedThemeId);
    toast.success(
      `${allThemes.find((t) => t.id === selectedThemeId)?.name} theme applied!`
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Palette className="h-6 w-6" />
                  Theme Customization
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Personalize your dashboard with beautiful themes and export
                  CSS for your projects
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CSSExportDialog theme={currentTheme} mode={themeMode} />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Theme Info */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">Current Theme</h3>
                <p className="text-sm text-muted-foreground">
                  {currentTheme.name} • {currentTheme.category} •{" "}
                  {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} Mode
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={themeMode === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemeMode("light")}
                  className="glass-button glass-button-hover"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={themeMode === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemeMode("dark")}
                  className="glass-button glass-button-hover"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Themes</Label>
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategory === category ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="glass-button glass-button-hover"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Selection */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Available Themes</CardTitle>
            <CardDescription>
              Choose from our collection of professionally designed themes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={themeMode}
              onValueChange={(value) => setThemeMode(value as ThemeMode)}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="light" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light Mode
                </TabsTrigger>
                <TabsTrigger value="dark" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </TabsTrigger>
              </TabsList>

              <TabsContent value="light" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredThemes.map((theme) => (
                    <ThemePreview
                      key={`${theme.id}-light`}
                      theme={theme}
                      mode="light"
                      isSelected={themeId === theme.id && themeMode === "light"}
                      onSelect={() => handleThemeSelect(theme.id as ThemeId)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="dark" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredThemes.map((theme) => (
                    <ThemePreview
                      key={`${theme.id}-dark`}
                      theme={theme}
                      mode="dark"
                      isSelected={themeId === theme.id && themeMode === "dark"}
                      onSelect={() => handleThemeSelect(theme.id as ThemeId)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {filteredThemes.length === 0 && (
              <div className="text-center py-12">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No themes found matching your search criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4 glass-button glass-button-hover"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Developer Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              For Developers
            </CardTitle>
            <CardDescription>
              Export and integrate these themes into your own projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">How to Use</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Select your preferred theme and mode</li>
                  <li>2. Click "Export CSS" to copy the variables</li>
                  <li>3. Paste into your project's global CSS file</li>
                  <li>4. Use the CSS variables in your components</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">CSS Variables</h4>
                <p className="text-sm text-muted-foreground">
                  All themes use consistent CSS variable names, making it easy
                  to switch between themes without changing your component
                  styles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
