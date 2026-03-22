/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as interviewInvitation } from './interview-invitation.tsx'
import { template as statusUpdate } from './status-update.tsx'
import { template as offerLetter } from './offer-letter.tsx'
import { template as rejection } from './rejection.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'interview-invitation': interviewInvitation,
  'status-update': statusUpdate,
  'offer-letter': offerLetter,
  'rejection': rejection,
}
