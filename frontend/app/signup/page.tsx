import Image from "next/image"
import { DevNotice } from "@/components/dev-notice"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="font-geist flex min-h-svh flex-col">
      <DevNotice />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <SignupForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <Image
            src="/a-c-ZzFIFbD7DE0-unsplash.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  )
}
