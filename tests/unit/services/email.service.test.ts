import { sendEmail } from '../../../src/services/email.service';

// Mock de nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
      if (callback) {
        callback(null, { messageId: 'test-message-id' });
      }
      return Promise.resolve({ messageId: 'test-message-id' });
    })
  })
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Email Service', () => {

  it('debería enviar un email correctamente', async () => {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'Este es un email de prueba',
      html: '<p>Este es un email de prueba</p>'
    };

    const result = await sendEmail(emailData);
    expect(result).toBe(true);
  });

  it('debería manejar errores al enviar email', async () => {
    // Mock para simular un error
    const nodemailer = require('nodemailer');
    
    // Clear previous mocks and set up the error case
    jest.resetModules();
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockRejectedValue(new Error('Error al enviar email'))
      })
    }));
    
    // Re-import the module to use the new mock
    const emailModule = require('../../../src/services/email.service');
    const { sendEmail: sendEmailMocked } = emailModule;

    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'Este es un email de prueba',
      html: '<p>Este es un email de prueba</p>'
    };

    // Expect the function to throw an error
    await expect(sendEmailMocked(emailData)).rejects.toThrow('Error al enviar email');
    
    // Restore the original mock for other tests
    jest.resetModules();
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
          if (callback) {
            callback(null, { messageId: 'test-message-id' });
          }
          return Promise.resolve({ messageId: 'test-message-id' });
        })
      })
    }));
  });
});