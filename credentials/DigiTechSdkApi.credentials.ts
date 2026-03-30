import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class DigiTechSdkApi implements ICredentialType {
  name = 'digiTechSdkApi';
  displayName = 'Digi Tech SDK API';
  documentationUrl = 'https://www.npmjs.com/package/digi-tech-sdk';
  properties: INodeProperties[] = [
    {
      displayName: 'Application ID',
      name: 'applicationId',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'your-app-id',
    },
    {
      displayName: 'Secret',
      name: 'secret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      placeholder: 'your-secret',
    },
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'QA',
          value: 'qa',
        },
        {
          name: 'Staging',
          value: 'staging',
        },
        {
          name: 'Production',
          value: 'production',
        },
      ],
      default: 'qa',
      required: true,
    },
  ];
}
