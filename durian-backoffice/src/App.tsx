"use client"
import { useState } from "react"
import { Sidebar, SidebarContent, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Database, Brain } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import TrainingDataList from "@/components/training-data-list"
import ModelsList from "@/components/models-list"

export default function Page() {
  const [activeTab, setActiveTab] = useState("training")
  const isMobile = useMobile()

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className={isMobile ? "w-full" : "w-64"} collapsible={isMobile ? "offcanvas" : "none"}>
          <SidebarContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                {isMobile && <SidebarTrigger />}
              </div>

              <div className="space-y-2">
                <Button
                  variant={activeTab === "training" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("training")}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Training Data
                </Button>

                <Button
                  variant={activeTab === "models" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("models")}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Models
                </Button>
              </div>

              <div className="mt-8 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {activeTab === "training"
                    ? "Manage training phases and add audio samples. Train models on collected data."
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
                <h1 className="text-xl font-semibold">{activeTab === "training" ? "Training Data" : "Models"}</h1>
                <SidebarTrigger />
              </div>
            )}

            <div className="flex-1 p-6 overflow-auto">
              {activeTab === "training" && (
                <div>
                  {!isMobile && <h1 className="text-2xl font-bold mb-6">Training Data</h1>}
                  <TrainingDataList />
                </div>
              )}
              {activeTab === "models" && (
                <div>
                  {!isMobile && <h1 className="text-2xl font-bold mb-6">Models</h1>}
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
