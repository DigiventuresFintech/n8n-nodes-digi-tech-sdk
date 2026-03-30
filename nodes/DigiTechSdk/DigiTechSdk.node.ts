import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DigiSDK } = require('digi-tech-sdk');

export class DigiTechSdk implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Digi Tech SDK',
    name: 'digiTechSdk',
    icon: 'file:digi-tech.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    description: 'Interact with the Digi API via the official Digi Tech SDK',
    defaults: {
      name: 'Digi Tech SDK',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'digiTechSdkApi',
        required: true,
      },
    ],
    properties: [
      // ─── RESOURCE ───────────────────────────────────────────────────────────
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Record',
            value: 'record',
          },
          {
            name: 'File',
            value: 'file',
          },
        ],
        default: 'record',
      },

      // ─── OPERATIONS: RECORD ─────────────────────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['record'],
          },
        },
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create a new record',
            action: 'Create a record',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Retrieve a record by ID',
            action: 'Get a record',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update an existing record',
            action: 'Update a record',
          },
          {
            name: 'Get Recovery Link',
            value: 'getLinkRecover',
            description: 'Get the recovery link for a record',
            action: 'Get recovery link',
          },
          {
            name: 'Get Applicant Link',
            value: 'getLinkApplicant',
            description: 'Get the applicant link for a record',
            action: 'Get applicant link',
          },
        ],
        default: 'create',
      },

      // ─── OPERATIONS: FILE ───────────────────────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['file'],
          },
        },
        options: [
          {
            name: 'Get File',
            value: 'getFile',
            description: 'Download a file by its URL',
            action: 'Get a file',
          },
        ],
        default: 'getFile',
      },

      // ─── FIELDS: CREATE ─────────────────────────────────────────────────────
      {
        displayName: 'First Name',
        name: 'firstname',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['create'],
          },
        },
        description: 'The first name of the applicant',
      },
      {
        displayName: 'Last Name',
        name: 'lastname',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['create'],
          },
        },
        description: 'The last name of the applicant',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@example.com',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['create'],
          },
        },
        description: 'The email address of the applicant',
      },
      {
        displayName: 'ID Number',
        name: 'idNumber',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['create'],
          },
        },
        description: 'The identification number of the applicant',
      },
      {
        displayName: 'Additional Properties (JSON)',
        name: 'additionalProperties',
        type: 'json',
        default: '{}',
        required: false,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['create'],
          },
        },
        description:
          'Optional extra fields to include in the record payload. These are merged with the basic fields above. Example: {"phone": "555-1234", "country": "AR"}',
        typeOptions: {
          alwaysOpenEditWindow: false,
        },
      },

      // ─── FIELDS: GET / GET LINKS ─────────────────────────────────────────────
      {
        displayName: 'Record ID',
        name: 'recordId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['get', 'getLinkRecover', 'getLinkApplicant'],
          },
        },
        description: 'The unique identifier of the record',
      },

      // ─── FIELDS: UPDATE ──────────────────────────────────────────────────────
      {
        displayName: 'Record ID',
        name: 'recordId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
          },
        },
        description: 'The unique identifier of the record to update',
      },
      {
        displayName: 'Update Data (JSON)',
        name: 'updateData',
        type: 'json',
        default: '{}',
        required: true,
        displayOptions: {
          show: {
            resource: ['record'],
            operation: ['update'],
          },
        },
        description:
          'JSON object with the fields to update. Example: {"vouchers": {"type": "document", "status": "pending", "data": {"documentType": "ID", "documentNumber": "12345678"}}}',
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
      },

      // ─── FIELDS: GET FILE ─────────────────────────────────────────────────────
      {
        displayName: 'File URL',
        name: 'fileUrl',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['file'],
            operation: ['getFile'],
          },
        },
        description: 'The URL of the file to download',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // ─── Credenciales ─────────────────────────────────────────────────────────
    const credentials = await this.getCredentials('digiTechSdkApi');
    const sdk = new DigiSDK({
      applicationId: credentials.applicationId as string,
      secret: credentials.secret as string,
      environment: credentials.environment as string,
    });

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    // ─── Loop sobre items ─────────────────────────────────────────────────────
    for (let i = 0; i < items.length; i++) {
      try {
        let result: unknown;

        // ── RECORD ─────────────────────────────────────────────────────────────
        if (resource === 'record') {

          // CREATE
          if (operation === 'create') {
            const firstname = this.getNodeParameter('firstname', i) as string;
            const lastname = this.getNodeParameter('lastname', i) as string;
            const email = this.getNodeParameter('email', i) as string;
            const idNumber = this.getNodeParameter('idNumber', i) as string;

            // Parse additional properties and merge
            let additionalProperties: IDataObject = {};
            const additionalRaw = this.getNodeParameter('additionalProperties', i, '{}') as string;
            if (additionalRaw && additionalRaw.trim() !== '' && additionalRaw.trim() !== '{}') {
              try {
                const parsed = typeof additionalRaw === 'string'
                  ? JSON.parse(additionalRaw)
                  : additionalRaw;
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                  additionalProperties = parsed as IDataObject;
                } else {
                  throw new NodeOperationError(
                    this.getNode(),
                    'Additional Properties must be a JSON object (not an array or primitive)',
                    { itemIndex: i },
                  );
                }
              } catch (parseError) {
                if (parseError instanceof NodeOperationError) throw parseError;
                throw new NodeOperationError(
                  this.getNode(),
                  `Invalid JSON in "Additional Properties": ${(parseError as Error).message}`,
                  { itemIndex: i },
                );
              }
            }

            // Basic fields take precedence — merge: additionalProperties first, then basics
            const recordData = {
              ...additionalProperties,
              firstname,
              lastname,
              email,
              idNumber,
            };

            result = await sdk.record.create(recordData);
          }

          // GET
          else if (operation === 'get') {
            const recordId = this.getNodeParameter('recordId', i) as string;
            result = await sdk.record.get(recordId);
          }

          // UPDATE
          else if (operation === 'update') {
            const recordId = this.getNodeParameter('recordId', i) as string;
            const rawUpdate = this.getNodeParameter('updateData', i) as string;
            let updateData: Record<string, unknown>;
            try {
              updateData = typeof rawUpdate === 'string' ? JSON.parse(rawUpdate) : rawUpdate;
            } catch {
              throw new NodeOperationError(
                this.getNode(),
                'Invalid JSON in "Update Data"',
                { itemIndex: i },
              );
            }
            result = await sdk.record.update(recordId, updateData);
          }

          // GET RECOVERY LINK
          else if (operation === 'getLinkRecover') {
            const recordId = this.getNodeParameter('recordId', i) as string;
            result = await sdk.record.getLinkRecover(recordId);
          }

          // GET APPLICANT LINK
          else if (operation === 'getLinkApplicant') {
            const recordId = this.getNodeParameter('recordId', i) as string;
            result = await sdk.record.getLinkApplicant(recordId);
          }

          else {
            throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
          }
        }

        // ── FILE ───────────────────────────────────────────────────────────────
        else if (resource === 'file') {
          if (operation === 'getFile') {
            const fileUrl = this.getNodeParameter('fileUrl', i) as string;
            result = await sdk.getFile(fileUrl);
          } else {
            throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
          }
        }

        else {
          throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
        }

        // ── Normalizar output ──────────────────────────────────────────────────
        const outputJson: IDataObject =
          result !== null && typeof result === 'object'
            ? (result as IDataObject)
            : { result: result as IDataObject };

        returnData.push({
          json: outputJson,
          pairedItem: { item: i },
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
