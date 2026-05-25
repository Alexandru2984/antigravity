# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Health endpoints' do
  it 'returns the health payload' do
    get '/health'

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq(
      'status' => 'ok',
      'service' => 'admin-panel'
    )
  end

  it 'returns the readiness payload' do
    get '/ready'

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq('status' => 'ready')
  end
end
