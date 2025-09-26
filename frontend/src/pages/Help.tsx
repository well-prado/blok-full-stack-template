import {
  Book,
  ExternalLink,
  HelpCircle,
  Mail,
  MessageSquare,
  Search,
  Star,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import React, { useState } from "react";

import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { blokRouter } from "../lib/blok-router";
import { useAuth } from "../contexts/AuthContext";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface DocumentationSection {
  title: string;
  description: string;
  icon: React.ElementType;
  links: {
    title: string;
    description: string;
    href: string;
  }[];
}

const faqData: FAQItem[] = [
  {
    question: "How do I reset my password?",
    answer:
      "You can reset your password by going to the Profile page and using the 'Change Password' section. You'll need to provide your current password to set a new one.",
    category: "Account",
  },
  {
    question: "How do I enable two-factor authentication?",
    answer:
      "Navigate to the Security page and toggle the Two-Factor Authentication switch. You'll need to scan a QR code with your authenticator app and enter a verification code.",
    category: "Security",
  },
  {
    question: "Can I upload a profile picture?",
    answer:
      "Yes! Go to your Profile page and click the camera icon on your avatar. You can upload images up to 2MB in size (JPG, PNG, GIF formats supported).",
    category: "Profile",
  },
  {
    question: "How do I view system analytics?",
    answer:
      "The Analytics page provides comprehensive insights into user activity, device distribution, and page performance. Access it from the main navigation menu.",
    category: "Analytics",
  },
  {
    question: "What admin features are available?",
    answer:
      "Admin users have access to user management, system monitoring, security logs, and advanced analytics. Admin-only features are marked in the navigation.",
    category: "Administration",
  },
  {
    question: "How do I manage active sessions?",
    answer:
      "Visit the Security page to see all your active sessions across devices. You can terminate any session except your current one for security purposes.",
    category: "Security",
  },
];

const documentationSections: DocumentationSection[] = [
  {
    title: "Getting Started",
    description: "Learn the basics of using the admin dashboard",
    icon: Book,
    links: [
      {
        title: "Quick Start Guide",
        description: "Get up and running in minutes",
        href: "#quick-start",
      },
      {
        title: "Dashboard Overview",
        description: "Understanding the main dashboard",
        href: "#dashboard-overview",
      },
      {
        title: "Navigation Guide",
        description: "How to navigate the interface",
        href: "#navigation",
      },
    ],
  },
  {
    title: "User Management",
    description: "Manage users, roles, and permissions",
    icon: Users,
    links: [
      {
        title: "Creating Users",
        description: "How to add new users to the system",
        href: "#create-users",
      },
      {
        title: "Role Management",
        description: "Assigning and managing user roles",
        href: "#roles",
      },
      {
        title: "User Permissions",
        description: "Understanding permission levels",
        href: "#permissions",
      },
    ],
  },
  {
    title: "Security Features",
    description: "Keep your account and data secure",
    icon: Star,
    links: [
      {
        title: "Two-Factor Authentication",
        description: "Setting up 2FA for enhanced security",
        href: "#2fa-setup",
      },
      {
        title: "Security Logs",
        description: "Monitoring account activity",
        href: "#security-logs",
      },
      {
        title: "Session Management",
        description: "Managing active login sessions",
        href: "#sessions",
      },
    ],
  },
];

export default function HelpPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    blokRouter.push("/login");
    return null;
  }

  const categories = [
    "All",
    ...Array.from(new Set(faqData.map((item) => item.category))),
  ];

  const filteredFAQ = faqData.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Help & Support
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Find answers to common questions and access documentation
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card glass-card-hover cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="glass-icon-container mx-auto mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get help from our support team
              </p>
              <Button
                variant="outline"
                className="glass-button glass-button-hover"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card glass-card-hover cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="glass-icon-container mx-auto mb-4">
                <Book className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse our comprehensive guides
              </p>
              <Button
                variant="outline"
                className="glass-button glass-button-hover"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Docs
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card glass-card-hover cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="glass-icon-container mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with other users
              </p>
              <Button
                variant="outline"
                className="glass-button glass-button-hover"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Forum
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Comprehensive guides and tutorials to help you get the most out of
              the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {documentationSections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="glass-icon-container">
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-12">
                    {section.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.href}
                        className="block p-3 rounded-lg glass-card glass-card-hover hover:no-underline"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{link.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {link.description}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions about using the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-input"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
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

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQ.length > 0 ? (
                filteredFAQ.map((item, index) => (
                  <Card key={index} className="glass-card glass-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg pr-4">
                          {item.question}
                        </h3>
                        <Badge variant="secondary" className="shrink-0">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No FAQ items found matching your search criteria
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
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? Get in touch with our support
              team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Email:</strong> support@blokadmin.com
                  </p>
                  <p className="text-sm">
                    <strong>Response Time:</strong> Within 24 hours
                  </p>
                  <p className="text-sm">
                    <strong>Support Hours:</strong> Monday - Friday, 9 AM - 5 PM
                    EST
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Before You Contact Us</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Check this FAQ section first</li>
                  <li>• Include your account email in your message</li>
                  <li>• Describe the issue with as much detail as possible</li>
                  <li>• Include any error messages you're seeing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
