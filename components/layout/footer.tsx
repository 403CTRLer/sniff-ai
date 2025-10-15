import Link from "next/link"
import { Code, Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#333333] bg-[#0D0D0D]">
      <div className="container px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#D4AF37] to-[#FFD700]">
                <Code className="h-4 w-4 text-[#0D0D0D]" />
              </div>
              <span className="font-bold text-gradient-gold">SniffAI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Advanced AI-powered code analysis for security, quality, and AI detection.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#D4AF37]">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover-gold">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/test" className="text-muted-foreground hover-gold">
                  Quick Test
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover-gold">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#D4AF37]">Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">AI Code Detection</li>
              <li className="text-muted-foreground">Security Analysis</li>
              <li className="text-muted-foreground">Test Coverage</li>
              <li className="text-muted-foreground">API Validation</li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#D4AF37]">Connect</h4>
            <div className="flex space-x-3">
              <Link href="#" className="text-muted-foreground hover:text-[#D4AF37] transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-[#D4AF37] transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-[#D4AF37] transition-colors">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#333333] flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">© 2024 SniffAI. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-xs text-muted-foreground hover-gold">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover-gold">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
