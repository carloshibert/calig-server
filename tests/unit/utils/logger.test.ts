import { logger } from '../../../src/utils/logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('debería tener los métodos de logging necesarios', () => {
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('debería poder llamar al método info', () => {
    // Espiar el método info
    const infoSpy = jest.spyOn(logger, 'info');
    
    // Llamar al método
    logger.info('Mensaje de prueba');
    
    // Verificar que fue llamado con el mensaje correcto
    expect(infoSpy).toHaveBeenCalledWith('Mensaje de prueba');
  });

  it('debería poder llamar al método error', () => {
    const errorSpy = jest.spyOn(logger, 'error');
    
    logger.error('Error de prueba');
    
    expect(errorSpy).toHaveBeenCalledWith('Error de prueba');
  });

  it('debería poder llamar al método warn', () => {
    const warnSpy = jest.spyOn(logger, 'warn');
    
    logger.warn('Advertencia de prueba');
    
    expect(warnSpy).toHaveBeenCalledWith('Advertencia de prueba');
  });

  it('debería poder llamar al método debug', () => {
    const debugSpy = jest.spyOn(logger, 'debug');
    
    logger.debug('Debug de prueba');
    
    expect(debugSpy).toHaveBeenCalledWith('Debug de prueba');
  });
});