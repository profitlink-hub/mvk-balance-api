class NetworkConfig {
  constructor({ id, ip, gateway, dns, createdAt = new Date() }) {
    this.id = id
    this.ip = ip
    this.gateway = gateway
    this.dns = dns
    this.createdAt = createdAt
  }

  // Validar se a configuração de rede tem dados válidos
  isValid() {
    return this.ip && 
           typeof this.ip === 'string' && 
           this.isValidIP(this.ip.trim()) &&
           this.gateway && 
           typeof this.gateway === 'string' && 
           this.isValidIP(this.gateway.trim()) &&
           this.dns && 
           typeof this.dns === 'string' && 
           this.isValidIP(this.dns.trim())
  }

  // Validar formato de IP
  isValidIP(ip) {
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip)
  }

  // Converter para objeto simples
  toJSON() {
    return {
      id: this.id,
      ip: this.ip,
      gateway: this.gateway,
      dns: this.dns,
      createdAt: this.createdAt
    }
  }
}

module.exports = NetworkConfig