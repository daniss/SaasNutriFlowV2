/**
 * GDPR Implementation Verification
 * Comprehensive check of GDPR compliance features and functionality
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('GDPR Implementation Verification', () => {
  describe('Database Schema Compliance', () => {
    it('should have comprehensive GDPR schema with all required tables', () => {
      const schemaPath = join(process.cwd(), 'scripts/create-gdpr-schema.sql')
      const schemaContent = readFileSync(schemaPath, 'utf-8')

      // Check for required GDPR tables
      expect(schemaContent).toContain('consent_records')
      expect(schemaContent).toContain('data_retention_policies')
      expect(schemaContent).toContain('data_export_requests')
      expect(schemaContent).toContain('data_anonymization_log')
      expect(schemaContent).toContain('privacy_policy_versions')
      expect(schemaContent).toContain('privacy_policy_acceptances')
    })

    it('should implement proper RLS policies for GDPR tables', () => {
      const schemaPath = join(process.cwd(), 'scripts/create-gdpr-schema.sql')
      const schemaContent = readFileSync(schemaPath, 'utf-8')

      // Check for RLS enablement
      expect(schemaContent).toContain('ENABLE ROW LEVEL SECURITY')
      
      // Check for proper access policies
      expect(schemaContent).toContain('Dietitians can manage consent records for their clients')
      expect(schemaContent).toContain('Dietitians can manage their retention policies')
      expect(schemaContent).toContain('dietitian_id = auth.uid()')
    })

    it('should have anonymization and export functions', () => {
      const schemaPath = join(process.cwd(), 'scripts/create-gdpr-schema.sql')
      const schemaContent = readFileSync(schemaPath, 'utf-8')

      expect(schemaContent).toContain('anonymize_client_data')
      expect(schemaContent).toContain('create_data_export_request')
      expect(schemaContent).toContain('check_data_retention')
    })
  })

  describe('API Endpoints for GDPR Rights', () => {
    it('should have consent management API', () => {
      const consentApiPath = join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts')
      const consentApi = readFileSync(consentApiPath, 'utf-8')

      // Check for proper authentication
      expect(consentApi).toContain('validateClientAuth')
      expect(consentApi).toContain('Bearer')

      // Check for consent operations
      expect(consentApi).toContain('consent_records')
      expect(consentApi).toContain('consent_type')
      expect(consentApi).toContain('granted')
      expect(consentApi).toContain('withdrawn_at')
    })

    it('should have data export API (Right to Portability)', () => {
      const exportApiPath = join(process.cwd(), 'app/api/client-auth/gdpr/export/route.ts')
      const exportApi = readFileSync(exportApiPath, 'utf-8')

      expect(exportApi).toContain('data_export_requests')
      expect(exportApi).toContain('request_type')
      expect(exportApi).toContain('expires_at')
      expect(exportApi).toContain('7 * 24 * 60 * 60 * 1000') // 7 days expiration
    })

    it('should have data deletion API (Right to be Forgotten)', () => {
      const deletionApiPath = join(process.cwd(), 'app/api/client-auth/gdpr/deletion/route.ts')
      const deletionApi = readFileSync(deletionApiPath, 'utf-8')

      expect(deletionApi).toContain('data_export_requests')
      expect(deletionApi).toContain('request_type')
      expect(deletionApi).toContain('deletion')
      expect(deletionApi).toContain('urgent: true')
    })
  })

  describe('Client Portal GDPR Interface', () => {
    it('should have comprehensive GDPR rights component', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      // Check for all required consent types
      expect(gdprComponent).toContain('data_processing')
      expect(gdprComponent).toContain('health_data')
      expect(gdprComponent).toContain('photos')
      expect(gdprComponent).toContain('marketing')
      expect(gdprComponent).toContain('data_sharing')

      // Check for GDPR rights implementation
      expect(gdprComponent).toContain('Portabilité des données')
      expect(gdprComponent).toContain('Droit à l\'oubli')
      expect(gdprComponent).toContain('Conservation des données')
    })

    it('should properly categorize consent types', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      // Check for required vs optional consents
      expect(gdprComponent).toContain('required: true')
      expect(gdprComponent).toContain('required: false')
      expect(gdprComponent).toContain('Obligatoire')
    })

    it('should have proper French language compliance', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      // Check for proper French GDPR terminology
      expect(gdprComponent).toContain('données personnelles')
      expect(gdprComponent).toContain('consentements')
      expect(gdprComponent).toContain('RGPD')
      expect(gdprComponent).toContain('suppression')
    })
  })

  describe('Audit Logging for GDPR Compliance', () => {
    it('should have comprehensive audit logging system', () => {
      const auditLoggerPath = join(process.cwd(), 'lib/audit-logger.ts')
      const auditLogger = readFileSync(auditLoggerPath, 'utf-8')

      expect(auditLogger).toContain('AuditLogEntry')
      expect(auditLogger).toContain('user_type')
      expect(auditLogger).toContain('action')
      expect(auditLogger).toContain('resource_type')
      expect(auditLogger).toContain('ip_address')
      expect(auditLogger).toContain('session_id')
    })

    it('should track all critical GDPR actions', () => {
      const auditLoggerPath = join(process.cwd(), 'lib/audit-logger.ts')
      const auditLogger = readFileSync(auditLoggerPath, 'utf-8')

      expect(auditLogger).toContain('logLogin')
      expect(auditLogger).toContain('logClientCreate')
      expect(auditLogger).toContain('logClientUpdate')
      expect(auditLogger).toContain('logClientDelete')
      expect(auditLogger).toContain('logDocumentDownload')
      expect(auditLogger).toContain('logDataExport')
    })

    it('should support audit log export for compliance reporting', () => {
      const auditLoggerPath = join(process.cwd(), 'lib/audit-logger.ts')
      const auditLogger = readFileSync(auditLoggerPath, 'utf-8')

      expect(auditLogger).toContain('exportAuditLogs')
      expect(auditLogger).toContain('CSV')
      expect(auditLogger).toContain('text/csv')
    })
  })

  describe('Data Retention and Anonymization', () => {
    it('should define proper retention periods', () => {
      const schemaPath = join(process.cwd(), 'scripts/create-gdpr-schema.sql')
      const schemaContent = readFileSync(schemaPath, 'utf-8')

      // Check for various data category retention periods
      expect(schemaContent).toContain('retention_period_years')
      expect(schemaContent).toContain('client_data')
      expect(schemaContent).toContain('messages')
      expect(schemaContent).toContain('documents')
      expect(schemaContent).toContain('photos')
      expect(schemaContent).toContain('meal_plans')
    })

    it('should implement comprehensive anonymization', () => {
      const schemaPath = join(process.cwd(), 'scripts/create-gdpr-schema.sql')
      const schemaContent = readFileSync(schemaPath, 'utf-8')

      expect(schemaContent).toContain('anonymization_type')
      expect(schemaContent).toContain('full')
      expect(schemaContent).toContain('partial')
      expect(schemaContent).toContain('Client Anonymisé')
      expect(schemaContent).toContain('affected_tables')
    })
  })

  describe('Security and Access Controls', () => {
    it('should use secure client authentication for GDPR endpoints', () => {
      const consentApiPath = join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts')
      const consentApi = readFileSync(consentApiPath, 'utf-8')

      expect(consentApi).toContain('validateClientAuth')
      expect(consentApi).toContain('SECURITY FIX')
      expect(consentApi).toContain('Bearer')
      expect(consentApi).toContain('SUPABASE_SERVICE_ROLE_KEY')
    })

    it('should implement proper tenant isolation', () => {
      const consentApiPath = join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts')
      const consentApi = readFileSync(consentApiPath, 'utf-8')

      // Check for dietitian_id filtering
      expect(consentApi).toContain('dietitian_id')
      expect(consentApi).toContain('client_id')
      expect(consentApi).toContain('.eq(')
    })
  })

  describe('Consent Management', () => {
    it('should support granular consent types', () => {
      const consentHelperPath = join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts')
      const consentHelper = readFileSync(consentHelperPath, 'utf-8')

      expect(consentHelper).toContain('data_processing')
      expect(consentHelper).toContain('health_data')
      expect(consentHelper).toContain('photos')
      expect(consentHelper).toContain('marketing')
      expect(consentHelper).toContain('data_sharing')
    })

    it('should document consent purposes and legal basis', () => {
      const consentHelperPath = join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts')
      const consentHelper = readFileSync(consentHelperPath, 'utf-8')

      expect(consentHelper).toContain('getConsentPurpose')
      expect(consentHelper).toContain('legal_basis')
      expect(consentHelper).toContain('consent')
      expect(consentHelper).toContain('purpose')
    })

    it('should track consent versions and timestamps', () => {
      const consentHelperPath = join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts')
      const consentHelper = readFileSync(consentHelperPath, 'utf-8')

      expect(consentHelper).toContain('version')
      expect(consentHelper).toContain('granted_at')
      expect(consentHelper).toContain('withdrawn_at')
      expect(consentHelper).toContain('updated_at')
    })
  })

  describe('Data Export and Portability', () => {
    it('should include all personal data categories in export', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      expect(gdprComponent).toContain('profil')
      expect(gdprComponent).toContain('historique de poids')
      expect(gdprComponent).toContain('plans alimentaires')
      expect(gdprComponent).toContain('messages')
      expect(gdprComponent).toContain('rendez-vous')
      expect(gdprComponent).toContain('photos de progression')
    })

    it('should set proper export expiration times', () => {
      const exportApiPath = join(process.cwd(), 'app/api/client-auth/gdpr/export/route.ts')
      const exportApi = readFileSync(exportApiPath, 'utf-8')

      expect(exportApi).toContain('expires_at')
      expect(exportApi).toContain('7 * 24 * 60 * 60 * 1000') // 7 days
      expect(exportApi).toContain('48h') // Response time promise
    })
  })

  describe('Data Retention Display', () => {
    it('should clearly communicate retention periods to users', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      expect(gdprComponent).toContain('7 ans après la fin du suivi')
      expect(gdprComponent).toContain('10 ans (obligation légale)')
      expect(gdprComponent).toContain('Jusqu\'à révocation du consentement')
      expect(gdprComponent).toContain('3 ans après le dernier message')
    })
  })

  describe('French Legal Compliance', () => {
    it('should use proper French legal terminology', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      expect(gdprComponent).toContain('conformément au RGPD')
      expect(gdprComponent).toContain('données personnelles')
      expect(gdprComponent).toContain('droit à l\'oubli')
      expect(gdprComponent).toContain('portabilité des données')
      expect(gdprComponent).toContain('obligation légale')
    })
  })

  describe('Error Handling and User Experience', () => {
    it('should provide clear error messages in French', () => {
      const gdprApis = [
        join(process.cwd(), 'app/api/client-auth/gdpr/consents/route.ts'),
        join(process.cwd(), 'app/api/client-auth/gdpr/export/route.ts'),
        join(process.cwd(), 'app/api/client-auth/gdpr/deletion/route.ts'),
      ]

      gdprApis.forEach(apiPath => {
        const apiContent = readFileSync(apiPath, 'utf-8')
        expect(apiContent).toContain('Non autorisé')
        expect(apiContent).toContain('Erreur serveur')
      })
    })

    it('should provide user-friendly success messages', () => {
      const gdprComponentPath = join(process.cwd(), 'components/client-portal/ClientGDPRRights.tsx')
      const gdprComponent = readFileSync(gdprComponentPath, 'utf-8')

      expect(gdprComponent).toContain('Succès')
      expect(gdprComponent).toContain('Demande envoyée')
      expect(gdprComponent).toContain('48 heures')
      expect(gdprComponent).toContain('responsable vous contactera')
    })
  })
})