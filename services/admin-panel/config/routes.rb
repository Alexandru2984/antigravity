# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)

  get '/health', to: proc {
    [200, { 'Content-Type' => 'application/json' }, ['{"status":"ok","service":"admin-panel"}']]
  }
  get '/ready', to: proc {
    [200, { 'Content-Type' => 'application/json' }, ['{"status":"ready"}']]
  }
end
