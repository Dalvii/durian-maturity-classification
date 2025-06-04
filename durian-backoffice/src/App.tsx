"use client"
import { useState } from "react"
import { Sidebar, SidebarContent, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Music, Brain } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import RecordsList from "@/components/records-list"
import ModelsList from "@/components/models-list"

export default function Page() {
  const [activeTab, setActiveTab] = useState("records")
  const isMobile = useMobile()

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className={isMobile ? "w-full" : "w-64"} collapsible={isMobile ? "offcanvas" : "none"}>
          <SidebarContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Durian Classifier <br />Back-Office</h2>
                {isMobile && <SidebarTrigger />}
              </div>

              <div className="space-y-2">
                <Button
                  variant={activeTab === "records" ? "default" : "ghost"}
                  className="w-full justify-start cursor-pointer"
                  onClick={() => setActiveTab("records")}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Recordings
                </Button>

                <Button
                  variant={activeTab === "models" ? "default" : "ghost"}
                  className="w-full justify-start cursor-pointer"
                  onClick={() => setActiveTab("models")}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Models
                </Button>
              </div>

              <div className="mt-8 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {activeTab === "records"
                    ? "Manage your audio recording files. You can listen to them directly or download them."
                    : "Access your trained AI models. Download them to use in your projects."}
                </p>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex flex-col h-full">
            {/* Header mobile avec menu hamburger */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <h1 className="text-xl font-semibold">
                  {activeTab === "records" ? "Audio Recordings" : "Trained Models"}
                </h1>
                <SidebarTrigger />
              </div>
            )}

            <div className="flex-1 p-6 overflow-auto">
              {activeTab === "records" && (
                <div>
                  {!isMobile && <h1 className="text-2xl font-bold mb-6">Audio Recordings</h1>}
                  <RecordsList />
                </div>
              )}
              {activeTab === "models" && (
                <div>
                  {!isMobile && <h1 className="text-2xl font-bold mb-6">Trained Models</h1>}
                  <ModelsList />
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
