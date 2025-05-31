variable "client_id" {}
variable "client_secret" {}
variable "subscription_id" {}
variable "tenant_id" {}

variable "resource_group_name" {
  default = "my-azure-db-rg"
}

variable "location" {
  default = "centralus"
}

variable "mysql_server_name" {
  default = "myazuremysqlsrv01"
}

variable "db_admin" {
  default = "azureuser"
}

variable "db_password" {
  sensitive = true
}

variable "db_name" {
  default = "mydatabase"
}
