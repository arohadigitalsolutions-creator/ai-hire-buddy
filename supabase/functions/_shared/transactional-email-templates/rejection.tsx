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

const RejectionEmail = ({ candidateName, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Application Update from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application Update</Heading>
        <Text style={text}>
          {candidateName ? `Dear ${candidateName},` : 'Dear Candidate,'}
        </Text>
        <Text style={text}>
          {message || 'Thank you for your interest. After careful review, we have decided to move forward with other candidates.'}
        </Text>
        <Text style={text}>
          We appreciate your time and wish you the best in your future endeavors.
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RejectionEmail,
  subject: 'Application Update',
  displayName: 'Rejection',
  previewData: { candidateName: 'John Smith' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1a2e', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '13px', color: '#888899', margin: '32px 0 0', borderTop: '1px solid #e8e8ee', paddingTop: '16px' }
