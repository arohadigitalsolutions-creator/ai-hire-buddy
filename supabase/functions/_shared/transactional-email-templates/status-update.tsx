import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "RecruitMonster"

interface Props {
  candidateName?: string
  message?: string
}

const StatusUpdateEmail = ({ candidateName, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Application Status Update from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application Status Update</Heading>
        <Text style={text}>
          {candidateName ? `Dear ${candidateName},` : 'Dear Candidate,'}
        </Text>
        <Text style={text}>
          {message || 'We wanted to update you on the status of your application. We are currently reviewing your profile.'}
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: StatusUpdateEmail,
  subject: 'Application Status Update',
  displayName: 'Status Update',
  previewData: { candidateName: 'John Smith', message: 'Your application is being reviewed by the hiring team.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1a2e', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '13px', color: '#888899', margin: '32px 0 0', borderTop: '1px solid #e8e8ee', paddingTop: '16px' }
