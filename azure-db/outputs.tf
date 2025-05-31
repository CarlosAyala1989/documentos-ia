output "mysql_server_name" {
  value = azurerm_mysql_flexible_server.mysql.name
}

output "admin_username" {
  value = var.db_admin
}

output "database_name" {
  value = var.db_name
}

output "mysql_fqdn" {
  value = azurerm_mysql_flexible_server.mysql.fqdn
}
