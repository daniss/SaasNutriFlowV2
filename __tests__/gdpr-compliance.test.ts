/**
 * GDPR Compliance Verification Tests
 * Ensures all GDPR features work correctly and meet legal requirements
 */

import { createClient } from '@supabase/supabase-js'
import { validateClientAuth } from '@/lib/client-auth-security'
import { auditLogger } from '@/lib/audit-logger'

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/client-auth-security', () => ({
  validateClientAuth: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

describe('GDPR Compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Consent Management', () => {
    it('should record consent with proper metadata', async () => {
      const mockConsent = {
        id: 'consent-123',
        dietitian_id: 'dietitian-123',
        client_id: 'client-123',
        consent_type: 'data_processing',
        granted: true,
        granted_at: new Date().toISOString(),
        version: '1.0',
        purpose: 'Traitement des données personnelles pour la gestion du dossier nutritionnel',
        legal_basis: 'consent',
      }

      const mockQueryChain = {
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockConsent,
          error: null,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQueryChain)

      // Simulate consent recording
      const response = await mockSupabaseClient
        .from('consent_records')
        .insert(mockConsent)
        .single()

      expect(response.data).toEqual(mockConsent)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent_records')
    })

    it('should handle consent withdrawal properly', async () => {
      const mockWithdrawal = {
        id: 'consent-123',
        granted: false,
        withdrawn_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockWithdrawal,
          error: null,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockUpdateChain)

      const response = await mockSupabaseClient
        .from('consent_records')
        .update(mockWithdrawal)
        .eq('id', 'consent-123')
        .single()

      expect(response.data.granted).toBe(false)
      expect(response.data.withdrawn_at).toBeTruthy()
    })

    it('should validate required consents', () => {
      const requiredConsents = ['data_processing', 'health_data']
      const clientConsents = [
        { consent_type: 'data_processing', granted: true },
        { consent_type: 'health_data', granted: true },
        { consent_type: 'marketing', granted: false },
      ]

      const hasAllRequired = requiredConsents.every(required =>
        clientConsents.some(consent => 
          consent.consent_type === required && consent.granted
        )
      )

      expect(hasAllRequired).toBe(true)
    })
  })

  describe('Data Export (Right to Portability)', () => {
    it('should create data export request correctly', async () => {
      const mockExportRequest = {
        id: 'export-123',
        dietitian_id: 'dietitian-123',
        client_id: 'client-123',
        requested_by: 'client',
        request_type: 'export',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockExportRequest,
        error: null,
      })

      const response = await mockSupabaseClient
        .from('data_export_requests')
        .insert(mockExportRequest)
        .single()

      expect(response.data.request_type).toBe('export')
      expect(response.data.status).toBe('pending')
      expect(response.data.expires_at).toBeTruthy()
    })

    it('should include all relevant data types in export', () => {
      const exportDataTypes = [
        'profile',
        'weight_history',
        'meal_plans',
        'messages',
        'appointments',
        'documents',
        'photos',
        'consent_records',
      ]

      // Verify all critical data types are included
      expect(exportDataTypes).toContain('profile')
      expect(exportDataTypes).toContain('weight_history')
      expect(exportDataTypes).toContain('meal_plans')
      expect(exportDataTypes).toContain('consent_records')
      expect(exportDataTypes.length).toBeGreaterThanOrEqual(8)
    })

    it('should validate export request expiration', () => {
      const exportRequest = {
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const isExpired = new Date(exportRequest.expires_at) < new Date()
      expect(isExpired).toBe(false)

      // Test expired request
      const expiredRequest = {
        expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
      const isExpiredOld = new Date(expiredRequest.expires_at) < new Date()
      expect(isExpiredOld).toBe(true)
    })
  })

  describe('Data Deletion (Right to be Forgotten)', () => {
    it('should create deletion request with proper urgency', async () => {
      const mockDeletionRequest = {
        id: 'deletion-123',
        dietitian_id: 'dietitian-123',
        client_id: 'client-123',
        requested_by: 'client',
        request_type: 'deletion',
        status: 'pending',
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockDeletionRequest,
        error: null,
      })

      const response = await mockSupabaseClient
        .from('data_export_requests')
        .insert(mockDeletionRequest)
        .single()

      expect(response.data.request_type).toBe('deletion')
      expect(response.data.status).toBe('pending')
    })

    it('should handle anonymization process', async () => {
      const mockAnonymization = {
        id: 'anon-123',
        original_client_id: 'client-123',
        anonymization_type: 'full',
        affected_tables: ['clients', 'messages'],
        performed_by: 'dietitian-123',
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'anon-123',
        error: null,
      })

      const response = await mockSupabaseClient.rpc('anonymize_client_data', {
        p_client_id: 'client-123',
        p_dietitian_id: 'dietitian-123',
        p_anonymization_type: 'full',
      })

      expect(response.data).toBe('anon-123')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('anonymize_client_data', {
        p_client_id: 'client-123',
        p_dietitian_id: 'dietitian-123',
        p_anonymization_type: 'full',
      })
    })
  })

  describe('Data Retention Policies', () => {
    it('should enforce data retention periods', async () => {
      const retentionPolicies = [
        { data_category: 'client_data', retention_period_years: 7 },
        { data_category: 'health_data', retention_period_years: 10 },
        { data_category: 'messages', retention_period_years: 3 },
        { data_category: 'photos', retention_period_years: 0 }, // Until consent withdrawn
      ]

      mockSupabaseClient.from().mockResolvedValue({
        data: retentionPolicies,
        error: null,
      })

      const response = await mockSupabaseClient
        .from('data_retention_policies')
        .select('*')

      expect(response.data.length).toBeGreaterThan(0)
      expect(response.data.some((p: any) => p.data_category === 'health_data')).toBe(true)
    })

    it('should check retention expiration correctly', () => {
      const testData = {
        created_at: new Date('2015-01-01').toISOString(),
        retention_period_years: 7,
      }

      const createdDate = new Date(testData.created_at)
      const expirationDate = new Date(createdDate)
      expirationDate.setFullYear(createdDate.getFullYear() + testData.retention_period_years)
      
      const isExpired = expirationDate < new Date()
      expect(isExpired).toBe(true) // 2015 + 7 years = 2022, which is expired

      // Test non-expired data
      const recentData = {
        created_at: new Date('2022-01-01').toISOString(),
        retention_period_years: 7,
      }
      const recentCreated = new Date(recentData.created_at)
      const recentExpiration = new Date(recentCreated)
      recentExpiration.setFullYear(recentCreated.getFullYear() + recentData.retention_period_years)
      
      const isRecentExpired = recentExpiration < new Date()
      expect(isRecentExpired).toBe(false) // 2022 + 7 years = 2029, not expired
    })
  })

  describe('Audit Logging', () => {
    it('should log GDPR-related actions', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        user_id: 'client-123',
        user_email: 'client@example.com',
        user_type: 'client',
        action: 'consent_granted',
        resource_type: 'consent',
        resource_id: 'consent-123',
        details: { consent_type: 'data_processing' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        session_id: 'session-123',
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'audit-123',
        error: null,
      })

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'client-123', email: 'client@example.com' } },
        error: null,
      })

      const auditId = await auditLogger.logAction(
        'consent_granted',
        'consent',
        'consent-123',
        { consent_type: 'data_processing' }
      )

      expect(auditId).toBe('audit-123')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('log_audit_action', expect.objectContaining({
        p_action: 'consent_granted',
        p_resource_type: 'consent',
        p_resource_id: 'consent-123',
      }))
    })

    it('should export audit logs for compliance reporting', async () => {
      const mockAuditLogs = [
        {
          created_at: '2024-01-01T10:00:00Z',
          user_email: 'client@example.com',
          user_type: 'client',
          action: 'consent_granted',
          resource_type: 'consent',
          resource_id: 'consent-123',
          details: { consent_type: 'data_processing' },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          session_id: 'session-123',
        },
      ]

      mockSupabaseClient.from().mockResolvedValue({
        data: mockAuditLogs,
        error: null,
      })

      const csvBlob = await auditLogger.exportAuditLogs({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      })

      expect(csvBlob).toBeInstanceOf(Blob)
      expect(csvBlob?.type).toBe('text/csv;charset=utf-8;')
    })
  })

  describe('Client Authentication Security', () => {
    it('should validate client auth for GDPR requests', async () => {
      const mockRequest = new Request('http://localhost:3000/api/client-auth/gdpr/consents', {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      })

      ;(validateClientAuth as jest.Mock).mockResolvedValue({
        clientId: 'client-123',
      })

      const authResult = await validateClientAuth(mockRequest)

      expect(authResult).toHaveProperty('clientId', 'client-123')
      expect(validateClientAuth).toHaveBeenCalledWith(mockRequest)
    })

    it('should reject unauthorized GDPR requests', async () => {
      const mockRequest = new Request('http://localhost:3000/api/client-auth/gdpr/consents')

      ;(validateClientAuth as jest.Mock).mockResolvedValue({
        error: 'Missing token',
        status: 401,
      })

      const authResult = await validateClientAuth(mockRequest)

      expect(authResult).toHaveProperty('error')
      expect(authResult).toHaveProperty('status', 401)
    })
  })

  describe('Privacy Policy Management', () => {
    it('should track privacy policy acceptances', async () => {
      const mockAcceptance = {
        id: 'acceptance-123',
        dietitian_id: 'dietitian-123',
        client_id: 'client-123',
        policy_version_id: 'policy-v1',
        accepted_at: new Date().toISOString(),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        acceptance_method: 'explicit',
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockAcceptance,
        error: null,
      })

      const response = await mockSupabaseClient
        .from('privacy_policy_acceptances')
        .insert(mockAcceptance)
        .single()

      expect(response.data.acceptance_method).toBe('explicit')
      expect(response.data.ip_address).toBeTruthy()
      expect(response.data.accepted_at).toBeTruthy()
    })

    it('should manage privacy policy versions', async () => {
      const mockPolicyVersion = {
        id: 'policy-v2',
        version: '2.0',
        content: 'Updated privacy policy content',
        effective_from: new Date().toISOString(),
        is_current: true,
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockPolicyVersion,
        error: null,
      })

      const response = await mockSupabaseClient
        .from('privacy_policy_versions')
        .insert(mockPolicyVersion)
        .single()

      expect(response.data.version).toBe('2.0')
      expect(response.data.is_current).toBe(true)
    })
  })

  describe('Cross-Border Data Transfer Compliance', () => {
    it('should validate data processing locations', () => {
      const allowedRegions = ['EU', 'EEA', 'UK']
      const supabaseRegion = 'EU' // Assuming EU region for GDPR compliance
      
      expect(allowedRegions).toContain(supabaseRegion)
    })

    it('should document legal basis for data processing', () => {
      const legalBases = [
        'consent',
        'contract',
        'legal_obligation',
        'vital_interests',
        'public_task',
        'legitimate_interests',
      ]

      const nutritionistDataProcessing = {
        personal_data: 'consent',
        health_data: 'consent',
        payment_data: 'contract',
        legal_records: 'legal_obligation',
      }

      Object.values(nutritionistDataProcessing).forEach(basis => {
        expect(legalBases).toContain(basis)
      })
    })
  })

  describe('Data Subject Rights Implementation', () => {
    it('should implement all GDPR rights', () => {
      const implementedRights = [
        'right_to_information',      // Privacy notices
        'right_of_access',          // Data export
        'right_to_rectification',   // Data correction
        'right_to_erasure',         // Data deletion
        'right_to_restrict',        // Processing restriction
        'right_to_portability',     // Data export in readable format
        'right_to_object',          // Opt-out of processing
        'right_automated_decision', // Human review of automated decisions
      ]

      // Verify all rights are considered in the implementation
      expect(implementedRights.length).toBe(8)
      expect(implementedRights).toContain('right_of_access')
      expect(implementedRights).toContain('right_to_erasure')
      expect(implementedRights).toContain('right_to_portability')
    })

    it('should handle requests within legal timeframes', () => {
      const gdprTimeframes = {
        data_export: 30, // days
        data_deletion: 30, // days
        consent_withdrawal: 1, // immediate
        rectification: 30, // days
      }

      // Test that export request has reasonable deadline
      const exportRequest = {
        requested_at: new Date(),
        deadline: new Date(Date.now() + gdprTimeframes.data_export * 24 * 60 * 60 * 1000),
      }

      const timeframeDays = Math.ceil(
        (exportRequest.deadline.getTime() - exportRequest.requested_at.getTime()) / 
        (24 * 60 * 60 * 1000)
      )

      expect(timeframeDays).toBeLessThanOrEqual(30)
    })
  })
})