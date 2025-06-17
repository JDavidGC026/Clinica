import React from 'react';
import EmailSendPanel from '@/components/email/EmailSendPanel';
import EmailHistoryList from '@/components/email/EmailHistoryList';
import EmailStats from '@/components/email/EmailStats';
import AutomatedNotifications from '@/components/email/AutomatedNotifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PsychologistEmailSendPanel from '@/components/email/PsychologistEmailSendPanel';

const EmailManager = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Notificaciones</h1>
          <p className="text-gray-600 mt-1">Envía emails a pacientes y psicólogos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <EmailHistoryList />
        </div>
        <div className="lg:col-span-1">
            <Tabs defaultValue="patient" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="patient">Para Pacientes</TabsTrigger>
                    <TabsTrigger value="psychologist">Para Psicólogos</TabsTrigger>
                </TabsList>
                <TabsContent value="patient">
                    <EmailSendPanel />
                </TabsContent>
                <TabsContent value="psychologist">
                    <PsychologistEmailSendPanel />
                </TabsContent>
            </Tabs>
        </div>
      </div>

      <EmailStats />
      <AutomatedNotifications />
    </div>
  );
};

export default EmailManager;