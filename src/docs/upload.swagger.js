module.exports = {
    paths: {
        '/api/v1/upload/single': {
            post: {
                tags: ['File Uploads'],
                summary: 'Upload a single file (image or document)',
                description: 'Uploads a single file to server disk storage under the specified category (properties, rooms, documents, profiles, general) and returns the public URL.',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'category',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['properties', 'rooms', 'documents', 'profiles', 'general'],
                            default: 'general'
                        },
                        description: 'Upload category directory'
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'File to upload (PDF, JPG, PNG, WEBP, DOCX, etc.)'
                                    }
                                },
                                required: ['file']
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'File uploaded successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string', example: 'File uploaded successfully' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                original_name: { type: 'string', example: 'pool.jpg' },
                                                stored_file_name: { type: 'string', example: '172337_a9b1c2.jpg' },
                                                file_path: { type: 'string', example: '/uploads/properties/172337_a9b1c2.jpg' },
                                                url: { type: 'string', example: 'http://localhost:3000/uploads/properties/172337_a9b1c2.jpg' },
                                                mime_type: { type: 'string', example: 'image/jpeg' },
                                                file_size: { type: 'integer', example: 1048576 },
                                                file_extension: { type: 'string', example: '.jpg' },
                                                category: { type: 'string', example: 'properties' },
                                                storage_provider: { type: 'string', example: 'LOCAL' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Missing file or invalid file format' }
                }
            }
        },
        '/api/v1/upload/multiple': {
            post: {
                tags: ['File Uploads'],
                summary: 'Upload multiple files (up to 10)',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'category',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['properties', 'rooms', 'documents', 'profiles', 'general'],
                            default: 'general'
                        }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    files: {
                                        type: 'array',
                                        items: { type: 'string', format: 'binary' }
                                    }
                                },
                                required: ['files']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Files uploaded successfully' },
                    400: { description: 'Validation error' }
                }
            }
        },
        '/api/v1/upload/document': {
            post: {
                tags: ['File Uploads'],
                summary: 'Upload a document directly to local storage',
                description: 'Uploads a document (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, PNG) into the local /uploads/documents directory and returns file metadata.',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'Document file (Max 25MB)'
                                    }
                                },
                                required: ['file']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Document uploaded to local storage successfully' },
                    400: { description: 'Missing file or invalid file format' }
                }
            }
        },
        '/api/v1/upload/property/image/{propertyId}': {
            post: {
                tags: ['File Uploads'],
                summary: 'Directly upload property image and save record to property_images',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'propertyId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    image_type_id: { type: 'integer', default: 1 },
                                    image_title: { type: 'string' },
                                    image_alt_text: { type: 'string' },
                                    is_cover_image: { type: 'boolean', default: false },
                                    image_order: { type: 'integer', default: 1 }
                                },
                                required: ['file']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Property image uploaded and saved successfully' },
                    400: { description: 'Missing file' },
                    403: { description: 'Unauthorized property ownership' }
                }
            }
        },
        '/api/v1/upload/room/image/{roomId}': {
            post: {
                tags: ['File Uploads'],
                summary: 'Directly upload room image and save record to room_images',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'roomId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    room_image_type_id: { type: 'integer', default: 1 },
                                    image_title: { type: 'string' },
                                    image_description: { type: 'string' },
                                    is_cover_image: { type: 'boolean', default: false },
                                    display_order: { type: 'integer', default: 1 }
                                },
                                required: ['file']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Room image uploaded and saved successfully' },
                    400: { description: 'Missing file' }
                }
            }
        },
        '/api/v1/upload/property/document/{propertyId}': {
            post: {
                tags: ['File Uploads'],
                summary: 'Directly upload property verification document and save to property_documents',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'propertyId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    document_type_id: { type: 'integer', default: 1 },
                                    document_number: { type: 'string' },
                                    document_title: { type: 'string' },
                                    document_description: { type: 'string' },
                                    remarks: { type: 'string' }
                                },
                                required: ['file']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Document uploaded and submitted for verification successfully' },
                    400: { description: 'Missing file' }
                }
            }
        }
    }
};
