# frozen_string_literal: true

Rails.application.routes.draw do
  ActiveAdmin.routes(self)

  get '/health', to: 'health#show'
  get '/ready', to: 'health#ready'
end
